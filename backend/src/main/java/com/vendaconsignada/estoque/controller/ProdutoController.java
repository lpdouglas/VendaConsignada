package com.vendaconsignada.estoque.controller;

import com.vendaconsignada.estoque.model.Produto;
import com.vendaconsignada.estoque.service.ProdutoImagemService;
import com.vendaconsignada.estoque.service.ProdutoService;
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
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {

    private final ProdutoService service;
    private final ProdutoImagemService imagemService;

    @GetMapping
    public List<Produto> listar() {
        return service.listar();
    }

    @GetMapping("/{codigo}")
    public Produto buscar(@PathVariable String codigo) {
        return service.buscarPorCodigo(codigo);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Produto criar(@Valid @RequestBody Produto produto) {
        return service.salvar(produto);
    }

    @PutMapping("/{codigo}")
    public Produto atualizar(@PathVariable String codigo, @Valid @RequestBody Produto produto) {
        return service.atualizar(codigo, produto);
    }

    @PostMapping(value = "/{codigo}/imagem", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Produto enviarImagem(@PathVariable String codigo, @RequestPart("imagem") MultipartFile imagem) {
        String caminho = imagemService.armazenar(codigo, imagem);
        return service.atualizarImagem(codigo, caminho);
    }

    @DeleteMapping("/{codigo}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable String codigo) {
        service.excluir(codigo);
    }
}
