package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.Revendedor;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RevendedorRepository extends MongoRepository<Revendedor, String> {
    Optional<Revendedor> findByCodigoDoRevendedor(Long codigoDoRevendedor);
    boolean existsByCodigoDoRevendedor(Long codigoDoRevendedor);
    boolean existsByCpf(String cpf);
}
