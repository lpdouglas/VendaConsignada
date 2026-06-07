package com.vendaconsignada.estoque.service;

public final class CpfValidator {

    private CpfValidator() {
    }

    public static boolean isValid(String cpf) {
        if (cpf == null) {
            return false;
        }

        String digits = cpf.replaceAll("\\D", "");
        if (digits.length() != 11 || digits.chars().distinct().count() == 1) {
            return false;
        }

        return digit(digits, 9) == Character.getNumericValue(digits.charAt(9))
                && digit(digits, 10) == Character.getNumericValue(digits.charAt(10));
    }

    public static String normalize(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    private static int digit(String digits, int length) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += Character.getNumericValue(digits.charAt(i)) * (length + 1 - i);
        }
        int result = 11 - (sum % 11);
        return result >= 10 ? 0 : result;
    }
}
