// Abre o WhatsApp SEM tirar o usuário do Pague Dez.
// Trocar a página atual (window.location) deixa uma tela em branco ao voltar do app do WhatsApp, em especial no celular.
// Em outra aba a página continua inteira; se o navegador bloquear a aba, o botão "Abrir WhatsApp" na tela serve de reserva.
export function abrirWhatsapp(url: string): void {
  const janela = window.open(url, "_blank")
  if (janela) janela.opener = null // a aba do WhatsApp não ganha acesso ao nosso app
}
