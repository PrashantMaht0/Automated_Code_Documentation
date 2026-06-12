package com.example.backend_api.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.backend_api.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
}