package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.ProdutoNoEstoque;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ProdutoNoEstoqueRepository extends MongoRepository<ProdutoNoEstoque, String> {
    Optional<ProdutoNoEstoque> findByCodigoDoProduto(String codigoDoProduto);
}
