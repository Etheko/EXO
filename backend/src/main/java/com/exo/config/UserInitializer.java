package com.exo.config;

import com.exo.model.Role;
import com.exo.model.User;
import com.exo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Value("${exo.force.user.init:false}")
    private boolean forceInit;

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            // Force reinitialization if environment variable is set
            if (forceInit) {
                log.info("Force initialization enabled. Clearing all users...");
                userRepository.deleteAll();
            }
            
            // Define the expected user data
            User expectedUser = createExpectedUser();
            
            // Check if user exists
            User existingUser = userRepository.findByUsername("etheko");
            
            if (existingUser != null) {
                // Update existing user if data has changed
                boolean needsUpdate = !Objects.equals(existingUser.getNick(), expectedUser.getNick()) ||
                                    !Objects.equals(existingUser.getEmail(), expectedUser.getEmail()) ||
                                    !Objects.equals(existingUser.getRealName(), expectedUser.getRealName()) ||
                                    !Objects.equals(existingUser.getFirstSurname(), expectedUser.getFirstSurname()) ||
                                    !Objects.equals(existingUser.getSecondSurname(), expectedUser.getSecondSurname()) ||
                                    !Objects.equals(existingUser.getGenderIdentity(), expectedUser.getGenderIdentity()) ||
                                    !Objects.equals(existingUser.getDateOfBirth(), expectedUser.getDateOfBirth()) ||
                                    !Objects.equals(existingUser.getDistinctivePhrase(), expectedUser.getDistinctivePhrase()) ||
                                    !Objects.equals(existingUser.getDescription(), expectedUser.getDescription()) ||
                                    !Objects.equals(existingUser.getGithub(), expectedUser.getGithub()) ||
                                    !Objects.equals(existingUser.getLinkedIn(), expectedUser.getLinkedIn()) ||
                                    !Objects.equals(existingUser.getLikes(), expectedUser.getLikes()) ||
                                    !Objects.equals(existingUser.getDislikes(), expectedUser.getDislikes());
                
                if (needsUpdate) {
                    log.info("Updating existing user 'etheko' with new data");
                    
                    // Update basic info
                    existingUser.setNick(expectedUser.getNick());
                    existingUser.setEmail(expectedUser.getEmail());
                    existingUser.setRealName(expectedUser.getRealName());
                    existingUser.setFirstSurname(expectedUser.getFirstSurname());
                    existingUser.setSecondSurname(expectedUser.getSecondSurname());
                    existingUser.setGenderIdentity(expectedUser.getGenderIdentity());
                    existingUser.setDateOfBirth(expectedUser.getDateOfBirth());
                    existingUser.setDistinctivePhrase(expectedUser.getDistinctivePhrase());
                    existingUser.setDescription(expectedUser.getDescription());
                    
                    // Update social links
                    existingUser.setGithub(expectedUser.getGithub());
                    existingUser.setLinkedIn(expectedUser.getLinkedIn());
                    
                    // Clear and update likes/dislikes
                    existingUser.getLikes().clear();
                    existingUser.getDislikes().clear();
                    existingUser.getLikes().addAll(expectedUser.getLikes());
                    existingUser.getDislikes().addAll(expectedUser.getDislikes());
                    
                    userRepository.save(existingUser);
                    log.info("'etheko' user updated successfully.");
                } else {
                    log.info("'etheko' user is up to date, no changes needed.");
                }
            } else {
                // Create new user
                log.info("Creating default admin user 'etheko'");
                userRepository.save(expectedUser);
                log.info("'etheko' user created successfully.");
            }
            
            log.info("User initialization completed. Total users: {}", userRepository.count());
            
        } catch (Exception e) {
            log.error("Could not initialize default user", e);
        }
    }
    
    private User createExpectedUser() {
        User user = new User();
        user.setUsername("etheko");
        user.setNick("Etheko");
        user.setEmail("etheko@example.com");
        // IMPORTANT: Use a strong password in production and store it securely
        user.setPassword(passwordEncoder.encode("admin"));
        user.setRole(Role.ADMIN);
        user.setDateOfBirth(LocalDate.of(2003, 3, 23));
        user.setRealName("Ethan");
        user.setFirstSurname("Ruiz");
        user.setGenderIdentity("he/him");
        user.setDistinctivePhrase("i wanna go to bed...");
        user.setDescription("🐾 hi fren! i'm Etheko (aka ethan but make it ✨aesthetic✨).\ni'm a ✨software engineer✨.\ni build web things (mostly angular+springboot) and make 'em look ✨shiny✨ with cool designs, animations, and sometimes cursed 3D stuff.\ncertified code gremlin, part-time UI sorcerer, full-time neko enjoyer.\ni break things so you don't have to (probably).\nnow scroll around. touch things. see what breaks.");
        user.setGithub("Etheko");
        user.setLinkedIn("izan-ruiz-ballesteros-890a28297");
        
        // Add likes
        List<String> expectedLikes = Arrays.asList(
            "🐈 cats!",
            "💻 computers",
            "🍎 apple thingies",
            "🎮 gaming",
            "🍄 nintendo fanboy",
            "⛏ minecraft",
            "✏ drawing",
            "🎶 making music",
            "💖 cute stuff",
            "🐾 furry!",
            "📺 anime",
            "🛡 cybersecurity",
            "🕺 agile methodologies",
            "🌐 web dev"
        );
        
        // Add dislikes
        List<String> expectedDislikes = Arrays.asList(
            "⛔phonk. plz. make it stop. it's horrible. tysm :)"
        );
        
        user.getLikes().addAll(expectedLikes);
        user.getDislikes().addAll(expectedDislikes);
        
        return user;
    }
}
