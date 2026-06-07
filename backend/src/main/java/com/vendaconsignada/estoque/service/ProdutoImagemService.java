package com.vendaconsignada.estoque.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ProdutoImagemService {

    private final ImagemLocalService imagemLocalService;

    public String armazenar(String codigoProduto, MultipartFile arquivo) {
        return imagemLocalService.armazenar("produtos", codigoProduto, arquivo);
    }
}
