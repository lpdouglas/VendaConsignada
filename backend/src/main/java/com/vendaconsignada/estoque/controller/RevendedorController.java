package com.vendaconsignada.estoque.controller;

import com.vendaconsignada.estoque.model.Revendedor;
import com.vendaconsignada.estoque.service.RevendedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/revendedores")
@RequiredArgsConstructor
public class RevendedorController {

    private final RevendedorService service;

    @GetMapping
    public List<Revendedor> listar() {
        return service.listar();
    }

    @GetMapping("/{codigo}")
    public Revendedor buscar(@PathVariable Long codigo) {
        return service.buscarPorCodigo(codigo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Revendedor criar(@Valid @RequestBody Revendedor revendedor) {
        return service.salvar(revendedor);
    }

    @PutMapping("/{codigo}")
    public Revendedor atualizar(@PathVariable Long codigo, @Valid @RequestBody Revendedor revendedor) {
        return service.atualizar(codigo, revendedor);
    }

    @PostMapping(value = "/{codigo}/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Revendedor enviarImagem(@PathVariable Long codigo, @RequestPart("imagem") MultipartFile imagem) {
        return service.atualizarImagem(codigo, imagem);
    }

    @DeleteMapping("/{codigo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long codigo) {
        service.excluir(codigo);
    }
}
