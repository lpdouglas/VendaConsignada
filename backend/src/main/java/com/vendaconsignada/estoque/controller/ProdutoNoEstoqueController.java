package com.vendaconsignada.estoque.controller;

import com.vendaconsignada.estoque.model.ProdutoNoEstoque;
import com.vendaconsignada.estoque.service.ProdutoNoEstoqueService;
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
@RequestMapping("/api/estoque")
@RequiredArgsConstructor
public class ProdutoNoEstoqueController {

    private final ProdutoNoEstoqueService service;

    @GetMapping
    public List<ProdutoNoEstoque> listar() {
        return service.listar();
    }

    @GetMapping("/{codigoDoProduto}")
    public ProdutoNoEstoque buscar(@PathVariable String codigoDoProduto) {
        return service.buscarPorCodigoDoProduto(codigoDoProduto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoNoEstoque criar(@Valid @RequestBody ProdutoNoEstoque estoque) {
        return service.salvar(estoque);
    }

    @PutMapping("/{codigoDoProduto}")
    public ProdutoNoEstoque atualizar(
            @PathVariable String codigoDoProduto,
            @Valid @RequestBody ProdutoNoEstoque estoque
    ) {
        return service.atualizar(codigoDoProduto, estoque);
    }

    @DeleteMapping("/{codigoDoProduto}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable String codigoDoProduto) {
        service.excluir(codigoDoProduto);
    }
}
