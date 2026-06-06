package com.vendaconsignada.estoque.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "produto")
public class Produto {

    @Id
    private String id;

    @NotBlank
    @Indexed(unique = true)
    private String codigo;

    @NotBlank
    private String nome;

    private String imagem;

    @NotNull
    private LocalDate fabricacao;

    @NotBlank
    private String categoria;

    private List<String> cores = new ArrayList<>();

    @NotNull
    @PositiveOrZero
    private BigDecimal valor;
}
