package com.vendaconsignada.estoque.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KitProduto {

    @NotBlank
    private String codigo;

    @Positive
    private long quantidade;
}
