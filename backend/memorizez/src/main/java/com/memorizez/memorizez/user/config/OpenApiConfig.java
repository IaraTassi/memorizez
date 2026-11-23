package com.memorizez.memorizez.user.config;

import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import jakarta.servlet.http.HttpServletRequest;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.core.providers.ObjectMapperProvider;
import org.springdoc.webmvc.ui.SwaggerIndexPageTransformer;
import org.springdoc.webmvc.ui.SwaggerIndexTransformer;
import org.springdoc.webmvc.ui.SwaggerWelcomeCommon;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.ResourceTransformerChain;
import org.springframework.web.servlet.resource.TransformedResource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Configuration
@SecurityScheme(
        name = "bearerAuth",
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Autenticação por token JWT"
)
public class OpenApiConfig {

    @Bean
    public SwaggerIndexTransformer swaggerIndexTransformer(
            SwaggerUiConfigProperties swaggerUiConfig,
            SwaggerUiOAuthProperties swaggerUiOAuthProperties,
            SwaggerWelcomeCommon swaggerWelcomeCommon,
            ObjectMapperProvider objectMapperProvider) {

        return new SwaggerIndexPageTransformer(
                swaggerUiConfig,
                swaggerUiOAuthProperties,
                swaggerWelcomeCommon,
                objectMapperProvider
        ) {
            @Override
            public Resource transform(
                    HttpServletRequest request,
                    Resource resource,
                    ResourceTransformerChain transformerChain
            ) throws IOException {

                Resource transformed = super.transform(
                        request,
                        resource,
                        transformerChain
                );

                if (!resource.getURL().toString().contains("swagger-initializer.js")) {
                    return transformed;
                }

                String content = new String(
                        transformed.getInputStream().readAllBytes(),
                        StandardCharsets.UTF_8
                );

                String loader = """
                        ;(() => {
                        const script = document.createElement('script');
                        script.src = '/swagger-csrf.js';
                        document.head.appendChild(script);
                        })();
                        """;

                return new TransformedResource(
                        resource,
                        (content + loader).getBytes(StandardCharsets.UTF_8)
                );
            }
        };
    }
}