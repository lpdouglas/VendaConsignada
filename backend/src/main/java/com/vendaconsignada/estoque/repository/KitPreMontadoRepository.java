package com.vendaconsignada.estoque.repository;

import com.vendaconsignada.estoque.model.KitPreMontado;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface KitPreMontadoRepository extends MongoRepository<KitPreMontado, String> {
    Optional<KitPreMontado> findByCodigo(String codigo);
}
