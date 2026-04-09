const $ = (id) => document.getElementById(id);

const valoresPrint = {
  receitaPj: 27000,
  salarioClt: 13800,
  dependentes: 1,
  aliquotaSimples: 8.31,
  planoSaude: 750,
  refeicao: 589.6,
  outrosBeneficios: 600,
  transporte: 440,
  contador: 350,
  contador13: 29.17,
  considerarTransporte: true
};

function money(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value || 0));
}

function calcularINSSProgressivo(valor) {
  return Math.min(valor * 0.0716, 988.07);
}

function calcularIRRFAproximado(base) {
  if (base <= 2428.8) return 0;
  if (base <= 2826.65) return base * 0.075 - 182.16;
  if (base <= 3751.05) return base * 0.15 - 394.16;
  if (base <= 4664.68) return base * 0.225 - 675.49;
  return base * 0.275 - 908.73;
}

function readValues() {
  return {
    receitaPj: parseFloat($('receitaPj').value || 0),
    salarioClt: parseFloat($('salarioClt').value || 0),
    dependentes: parseInt($('dependentes').value || 0, 10),
    aliquotaSimples: parseFloat($('aliquotaSimples').value || 0) / 100,
    planoSaude: parseFloat($('planoSaude').value || 0),
    refeicao: parseFloat($('refeicao').value || 0),
    outrosBeneficios: parseFloat($('outrosBeneficios').value || 0),
    transporte: parseFloat($('transporte').value || 0),
    contador: parseFloat($('contador').value || 0),
    contador13: parseFloat($('contador13').value || 0),
    considerarTransporte: $('considerarTransporte').checked
  };
}

function calcular() {
  const v = readValues();
  const deducaoDependente = v.dependentes * 189.59;

  const cltInss = calcularINSSProgressivo(v.salarioClt);
  const cltBaseIrrf = v.salarioClt - cltInss - deducaoDependente;
  const cltIrrf = Math.max(0, calcularIRRFAproximado(cltBaseIrrf));
  const cltLiquido = v.salarioClt - cltInss - cltIrrf;
  const cltBeneficios = v.planoSaude + v.refeicao + v.outrosBeneficios;
  const cltEquivalente = cltLiquido + cltBeneficios - (v.considerarTransporte ? v.transporte : 0);

  const impostosNf = v.receitaPj * v.aliquotaSimples;
  const proLabore = v.salarioClt * 0.61417;
  const pjInss = calcularINSSProgressivo(proLabore);
  const pjBaseIrrf = proLabore - pjInss - deducaoDependente;
  const pjIrrf = Math.max(0, calcularIRRFAproximado(pjBaseIrrf));
  const pjTotalEncargos = impostosNf + v.contador + v.contador13 + pjInss + pjIrrf;
  const pjLiquido = v.receitaPj - pjTotalEncargos;
  const diferenca = pjLiquido - cltEquivalente;

  return {
    ...v,
    cltInss,
    cltBaseIrrf,
    cltIrrf,
    cltLiquido,
    cltBeneficios,
    cltEquivalente,
    impostosNf,
    proLabore,
    pjInss,
    pjBaseIrrf,
    pjIrrf,
    pjTotalEncargos,
    pjLiquido,
    diferenca
  };
}

function render() {
  const d = calcular();

  $('totalCltEquiv').textContent = money(d.cltEquivalente);
  $('totalPjLiquido').textContent = money(d.pjLiquido);
  $('diferenca').textContent = money(Math.abs(d.diferenca));

  let mensagem = 'Os dois cenários estão praticamente empatados.';
  if (d.diferenca > 0) mensagem = `PJ está na frente por ${money(d.diferenca)} por mês.`;
  if (d.diferenca < 0) mensagem = `CLT está na frente por ${money(Math.abs(d.diferenca))} por mês.`;
  $('mensagemVantagem').textContent = mensagem;

  $('cltBruto').textContent = money(d.salarioClt);
  $('cltInss').textContent = money(d.cltInss);
  $('cltBaseIrrf').textContent = money(d.cltBaseIrrf);
  $('cltIrrf').textContent = money(d.cltIrrf);
  $('cltLiquido').textContent = money(d.cltLiquido);
  $('cltBeneficios').textContent = money(d.cltBeneficios);
  $('cltEquivalente').textContent = money(d.cltEquivalente);

  $('pjReceita').textContent = money(d.receitaPj);
  $('pjImpostosNf').textContent = money(d.impostosNf);
  $('pjContador').textContent = money(d.contador + d.contador13);
  $('pjProLabore').textContent = money(d.proLabore);
  $('pjInss').textContent = money(d.pjInss);
  $('pjIrrf').textContent = money(d.pjIrrf);
  $('pjLiquido').textContent = money(d.pjLiquido);

  $('miniCltLiquido').textContent = money(d.cltLiquido);
  $('miniBeneficios').textContent = money(d.cltBeneficios);
  $('miniEncargos').textContent = money(d.pjTotalEncargos);
  $('miniProlabore').textContent = money(d.proLabore);

  $('barCltLabel').textContent = money(d.cltEquivalente);
  $('barPjLabel').textContent = money(d.pjLiquido);

  const maior = Math.max(d.cltEquivalente, d.pjLiquido, 1);
  $('barClt').style.width = `${(d.cltEquivalente / maior) * 100}%`;
  $('barPj').style.width = `${(d.pjLiquido / maior) * 100}%`;

  const advantagePercent = Math.min(100, (Math.abs(d.diferenca) / Math.max(d.cltEquivalente, d.pjLiquido, 1)) * 100);
  $('gaugeCircle').style.setProperty('--value', advantagePercent.toFixed(1));
  $('gaugePercent').textContent = `${advantagePercent.toFixed(0)}%`;

  const winnerBox = $('winnerBox');
  if (Math.abs(d.diferenca) < 100) {
    winnerBox.textContent = 'O resultado está muito próximo. Vale olhar fatores não financeiros, como férias, risco e previsibilidade.';
  } else if (d.diferenca > 0) {
    winnerBox.textContent = 'Visualmente o modelo PJ está mais vantajoso nesta simulação. Confira também provisões, segurança e benefícios indiretos.';
  } else {
    winnerBox.textContent = 'Visualmente o modelo CLT está mais vantajoso nesta simulação. O pacote de benefícios e o líquido equivalente sustentam o resultado.';
  }
}

function preencherComPrint() {
  Object.entries(valoresPrint).forEach(([key, value]) => {
    const el = $(key);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = value;
    else el.value = value;
  });
  render();
}

function limparCampos() {
  document.querySelectorAll('input').forEach((input) => {
    if (input.type === 'checkbox') {
      input.checked = false;
    } else {
      input.value = 0;
    }
  });
  render();
}

document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('input', render);
  input.addEventListener('change', render);
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((btn) => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((content) => content.classList.remove('active'));

    tab.classList.add('active');
    document.querySelector(`.tab-content[data-content="${tab.dataset.tab}"]`).classList.add('active');
  });
});

$('preencherPrint').addEventListener('click', preencherComPrint);
$('zerarCampos').addEventListener('click', limparCampos);

render();
