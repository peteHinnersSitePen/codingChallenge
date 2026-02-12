package com.issuetracker.service;

import com.issuetracker.dto.AuthRequest;
import com.issuetracker.dto.AuthResponse;
import com.issuetracker.dto.SignupRequest;
import com.issuetracker.model.User;
import com.issuetracker.repository.UserRepository;
import com.issuetracker.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    @Lazy
    private AuthenticationManager authenticationManager;
    
    @Transactional
    public AuthResponse signup(SignupRequest signupRequest) {
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();
        user.setName(signupRequest.getName());
        user.setEmail(signupRequest.getEmail());
        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());
        user.setPassword(encodedPassword);
        
        user = userRepository.save(user);
        System.out.println("User created: " + user.getEmail() + " (ID: " + user.getId() + ")");
        
        String token = jwtUtil.generateToken(user.getEmail());
        
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId());
    }
    
    public AuthResponse login(AuthRequest authRequest) {
        System.out.println("Login attempt for email: " + authRequest.getEmail());
        
        // Check if user exists first
        User user = userRepository.findByEmail(authRequest.getEmail()).orElse(null);
        if (user == null) {
            System.out.println("User not found in database");
            throw new RuntimeException("Invalid email or password");
        }
        System.out.println("User found: " + user.getEmail() + " (ID: " + user.getId() + ")");
        
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    authRequest.getEmail(),
                    authRequest.getPassword()
                )
            );
            System.out.println("Authentication successful");
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());
            throw new RuntimeException("Invalid email or password", e);
        }
        
        String token = jwtUtil.generateToken(user.getEmail());
        
        return new AuthResponse(token, user.getEmail(), user.getName(), user.getId());
    }
    
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("loadUserByUsername called for: " + email);
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> {
                System.out.println("User not found in loadUserByUsername: " + email);
                return new UsernameNotFoundException("User not found with email: " + email);
            });
        
        System.out.println("User loaded: " + user.getEmail() + " (ID: " + user.getId() + ")");
        
        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getEmail())
            .password(user.getPassword())
            .authorities("ROLE_USER")
            .build();
    }
}
