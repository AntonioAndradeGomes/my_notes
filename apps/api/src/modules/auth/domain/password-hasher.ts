/**
 * Porta de hashing de senha.
 *
 * O domínio declara o que precisa; a infraestrutura escolhe o algoritmo. Trocar
 * de algoritmo no futuro não toca em nenhum caso de uso.
 */
export abstract class PasswordHasher {
  abstract hash(plain: string): Promise<string>;
  abstract verify(hash: string, plain: string): Promise<boolean>;
}
