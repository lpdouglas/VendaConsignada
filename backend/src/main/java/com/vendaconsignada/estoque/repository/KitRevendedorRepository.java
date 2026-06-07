package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.KitRevendedor;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface KitRevendedorRepository extends MongoRepository<KitRevendedor, String> {
    Optional<KitRevendedor> findByCodigoDoKit(Long codigoDoKit);
    boolean existsByCodigoDoKit(Long codigoDoKit);
}
