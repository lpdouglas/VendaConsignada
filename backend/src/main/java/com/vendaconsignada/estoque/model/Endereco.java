package com.vendaconsignada.estoque.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Endereco {

    private String cep;

    private String endereco;

    private String numero;

    private String bairro;

    private String cidade;

    private String uf;
}
