package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.Categoria;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CategoriaRepository extends MongoRepository<Categoria, String> {
    Optional<Categoria> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
