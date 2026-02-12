package com.issuetracker.filter;

import com.issuetracker.service.AuthService;
import com.issuetracker.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private AuthService authService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");
        
        String email = null;
        String jwt = null;
        
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                email = jwtUtil.getEmailFromToken(jwt);
            } catch (Exception e) {
                logger.error("Error extracting email from token", e);
            }
        }
        
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                UserDetails userDetails = authService.loadUserByUsername(email);
                
                if (jwtUtil.validateToken(jwt, email)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                    logger.debug("Successfully authenticated user: " + email);
                } else {
                    logger.warn("Token validation failed for user: " + email);
                }
            } catch (Exception e) {
                logger.error("Error validating token for email: " + email, e);
                // Don't set authentication - let Spring Security handle unauthorized access
            }
        } else if (authorizationHeader != null && !authorizationHeader.startsWith("Bearer ")) {
            logger.warn("Invalid Authorization header format");
        }
        
        chain.doFilter(request, response);
    }
}
