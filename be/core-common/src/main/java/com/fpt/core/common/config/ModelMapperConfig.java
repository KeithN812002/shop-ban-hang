package com.fpt.core.common.config;

import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ModelMapperConfig {

        @Bean
        public ModelMapper modelMapper() {
                ModelMapper modelMapper = new ModelMapper();
                modelMapper.getConfiguration()
                                .setAmbiguityIgnored(true)
                                .setMatchingStrategy(MatchingStrategies.STRICT)
                                .setSkipNullEnabled(false);
                return modelMapper;
        }
}
