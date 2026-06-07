package com.vendaconsignada.estoque.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProdutoRetirado {

    @NotBlank
    private String codigo;

    @Positive
    private long quantidade;

    @PositiveOrZero
    private BigDecimal valor;
}
