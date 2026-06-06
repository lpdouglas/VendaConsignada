package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.Produto;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProdutoRepository extends MongoRepository<Produto, String> {
    Optional<Produto> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}
