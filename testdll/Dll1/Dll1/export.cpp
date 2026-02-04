#include "pch.h"

extern "C" {

    __declspec(dllexport)
        float addition(int x, float y) {
        return x + y;
    }

    __declspec(dllexport)
        float multiplication(int x, float y) {
        return x * y;
    }

}
