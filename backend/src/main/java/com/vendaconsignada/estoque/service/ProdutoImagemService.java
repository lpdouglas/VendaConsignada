package com.vendaconsignada.estoque.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProdutoImagemService {

    private static final Set<String> EXTENSOES_PERMITIDAS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public String armazenar(String codigoProduto, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Arquivo de imagem nao informado");
        }

        String original = StringUtils.cleanPath(arquivo.getOriginalFilename() == null ? "" : arquivo.getOriginalFilename());
        String extensao = obterExtensao(original);
        if (!EXTENSOES_PERMITIDAS.contains(extensao)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato de imagem nao permitido");
        }

        try {
            Path pasta = Path.of(uploadDir, "produtos").toAbsolutePath().normalize();
            Files.createDirectories(pasta);

            String nomeArquivo = codigoProduto + "-" + UUID.randomUUID() + "." + extensao;
            Path destino = pasta.resolve(nomeArquivo).normalize();
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/produtos/" + nomeArquivo;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nao foi possivel salvar a imagem", ex);
        }
    }

    private String obterExtensao(String nomeArquivo) {
        int indice = nomeArquivo.lastIndexOf('.');
        if (indice < 0 || indice == nomeArquivo.length() - 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Imagem sem extensao valida");
        }
        return nomeArquivo.substring(indice + 1).toLowerCase();
    }
}
