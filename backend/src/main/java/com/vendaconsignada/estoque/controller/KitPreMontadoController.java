package com.vendaconsignada.estoque.controller;

import com.vendaconsignada.estoque.model.KitPreMontado;
import com.vendaconsignada.estoque.service.KitPreMontadoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/kits-pre-montados")
@RequiredArgsConstructor
public class KitPreMontadoController {

    private final KitPreMontadoService service;

    @GetMapping
    public List<KitPreMontado> listar() {
        return service.listar();
    }

    @GetMapping("/{codigo}")
    public KitPreMontado buscar(@PathVariable Long codigo) {
        return service.buscarPorCodigo(codigo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public KitPreMontado criar(@Valid @RequestBody KitPreMontado kit) {
        return service.salvar(kit);
    }

    @PutMapping("/{codigo}")
    public KitPreMontado atualizar(@PathVariable Long codigo, @Valid @RequestBody KitPreMontado kit) {
        return service.atualizar(codigo, kit);
    }

    @DeleteMapping("/{codigo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long codigo) {
        service.excluir(codigo);
    }
}
