package com.vendaconsignada.estoque.service;

import com.vendaconsignada.estoque.model.KitPreMontado;
import com.vendaconsignada.estoque.repository.KitPreMontadoRepository;
import com.vendaconsignada.estoque.repository.ProdutoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class KitPreMontadoService {

    private final KitPreMontadoRepository repository;
    private final ProdutoRepository produtoRepository;

    public List<KitPreMontado> listar() {
        return repository.findAll();
    }

    public KitPreMontado buscarPorCodigo(String codigo) {
        return repository.findByCodigo(codigo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kit pre montado nao encontrado"));
    }

    public KitPreMontado salvar(KitPreMontado kit) {
        kit.setId(null);
        validarProdutos(kit.getProdutos());
        return persistir(kit);
    }

    public KitPreMontado atualizar(String codigo, KitPreMontado kit) {
        KitPreMontado atual = buscarPorCodigo(codigo);
        kit.setId(atual.getId());
        kit.setCodigo(codigo);
        validarProdutos(kit.getProdutos());
        return persistir(kit);
    }

    public void excluir(String codigo) {
        repository.delete(buscarPorCodigo(codigo));
    }

    private void validarProdutos(List<String> codigosProdutos) {
        for (String codigoProduto : codigosProdutos) {
            if (!produtoRepository.existsByCodigo(codigoProduto)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto do kit nao existe: " + codigoProduto);
            }
        }
    }

    private KitPreMontado persistir(KitPreMontado kit) {
        try {
            return repository.save(kit);
        } catch (DuplicateKeyException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Codigo de kit ja cadastrado", ex);
        }
    }
}
