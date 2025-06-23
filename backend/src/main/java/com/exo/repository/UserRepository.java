package com.exo.repository;

import com.exo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // Fetch user by primary key (username)
    User findByUsername(String username);

    // Fetch user by email address
    User findByEmail(String email);
}
