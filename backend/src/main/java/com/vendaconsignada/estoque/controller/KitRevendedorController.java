package com.vendaconsignada.estoque.controller;

import com.vendaconsignada.estoque.model.KitRevendedor;
import com.vendaconsignada.estoque.service.KitRevendedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/kits-revendedor")
@RequiredArgsConstructor
public class KitRevendedorController {

    private final KitRevendedorService service;

    @GetMapping
    public List<KitRevendedor> listar() {
        return service.listar();
    }

    @GetMapping("/{codigo}")
    public KitRevendedor buscar(@PathVariable Long codigo) {
        return service.buscarPorCodigo(codigo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KitRevendedor criar(@Valid @RequestBody KitRevendedor kit) {
        return service.salvar(kit);
    }
}
