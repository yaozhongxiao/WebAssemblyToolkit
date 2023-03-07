// clang $(<flags) loop.c -o loop.wasm
// wasm2wat loop.wasm -o loop.wat

int for_loop(int n, int m) {
  int result = 0;
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
      if (m % 2 == 0) {
        result += j;
      }
      if (n % 2 != 0) {
        result += i;
      }
    }
  }
  return result;
}