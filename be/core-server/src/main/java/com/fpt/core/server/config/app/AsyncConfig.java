package com.fpt.core.server.config.app;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.task.DelegatingSecurityContextAsyncTaskExecutor;

import jakarta.annotation.PreDestroy;
import java.util.concurrent.Executor;

@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private ThreadPoolTaskExecutor mainExecutor;

    @Override
    public Executor getAsyncExecutor() {
        mainExecutor = new ThreadPoolTaskExecutor();
        mainExecutor.setCorePoolSize(5);
        mainExecutor.setMaxPoolSize(10);
        mainExecutor.setQueueCapacity(100);
        mainExecutor.setThreadNamePrefix("AsyncTask-");
        
        // Graceful shutdown configuration
        mainExecutor.setWaitForTasksToCompleteOnShutdown(true);
        mainExecutor.setAwaitTerminationSeconds(60); // Wait up to 60 seconds for tasks to complete
        
        // Rejection policy when queue is full
        mainExecutor.setRejectedExecutionHandler((runnable, threadPoolExecutor) -> {
            log.warn("Async task rejected due to full queue. Task: {}", runnable.toString());
            // Optionally, you can implement custom handling here
            throw new RuntimeException("Async task queue is full");
        });
        
        mainExecutor.initialize();
        
        return new DelegatingSecurityContextAsyncTaskExecutor(mainExecutor);
    }
    
    @PreDestroy
    public void cleanup() {
        log.info("Shutting down async executor...");
        
        if (mainExecutor != null) {
            log.info("Shutting down main async executor. Active tasks: {}, Queue size: {}", 
                    mainExecutor.getActiveCount(), mainExecutor.getQueueSize());
            mainExecutor.shutdown();
        }
        
        log.info("Async executor shutdown completed");
    }
}
