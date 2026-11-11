package com.fpt.core.server.aspect;

import com.fpt.core.cache.service.CacheService;
import com.fpt.core.security.annotation.RequirePermission;
import com.fpt.core.security.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;

@Aspect
@Component
@Slf4j
@RequiredArgsConstructor
public class PermissionAspect {

    private final CacheService cacheService;

    @Before("@within(com.fpt.core.security.annotation.RequirePermission)"
            + " || @annotation(com.fpt.core.security.annotation.RequirePermission)")
    @SuppressWarnings("null")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();

        RequirePermission requirePermission = AnnotatedElementUtils.findMergedAnnotation(method, RequirePermission.class);
        if (requirePermission == null) {
            requirePermission = AnnotatedElementUtils.findMergedAnnotation(method.getDeclaringClass(), RequirePermission.class);
        }
        if (requirePermission != null && requirePermission.requireInternal()
                && SecurityUtils.getCurrentUnitId(cacheService).isEmpty()) {
            String methodName = method.getDeclaringClass().getSimpleName() + "." + method.getName();
            log.warn("Permission denied - internal account required. user={}, method={}",
                    SecurityUtils.getCurrentUsername(), methodName);
            throw new AccessDeniedException(requirePermission.message());
        }
    }
}
