import { describe, expect, it } from "vitest";
import { gerarPlanoAula, passoAPassoOrganizar, revisarCurso } from "@/lib/lia-professora";

describe("Lia professora", () => {
  it("completa o que falta e o tempo das partes fecha com a duração da aula", () => {
    const { plano, completados } = gerarPlanoAula(
      { titulo: "Celular sem mistério", categoria: "Tecnologia" },
      { tema: "Mandar áudio no WhatsApp" },
    );
    expect(plano.duracaoMin).toBe(90);
    expect(plano.etapas.reduce((s, e) => s + e.minutos, 0)).toBe(90);
    expect(plano.objetivo).toMatch(/mandar áudio/i);
    expect(plano.materiais.length).toBeGreaterThan(2);
    expect(completados.length).toBeGreaterThanOrEqual(3);
  });

  it("respeita o que o professor escreveu", () => {
    const { plano, completados } = gerarPlanoAula(
      { titulo: "Dança", categoria: "Movimento", duracaoMin: 60 },
      { tema: "Bolero", objetivo: "Dançar o passo básico", materiais: ["Caixa de som"] },
    );
    expect(plano.objetivo).toBe("Dançar o passo básico");
    expect(plano.materiais).toContain("Caixa de som");
    expect(plano.etapas.some((e) => e.titulo === "Intervalo")).toBe(false);
    expect(plano.etapas.reduce((s, e) => s + e.minutos, 0)).toBe(60);
    expect(completados.join(" ")).not.toMatch(/objetivo/);
  });

  it("aponta o que falta no curso e monta o passo a passo de organização", () => {
    const faltas = revisarCurso({ titulo: "Crochê", categoria: "Arte" }).map((s) => s.campo);
    expect(faltas).toEqual(
      expect.arrayContaining([
        "descricao",
        "local",
        "diaHorario",
        "duracaoMin",
        "vagas",
        "oQueLevar",
      ]),
    );
    expect(passoAPassoOrganizar({ titulo: "Crochê", categoria: "Arte" })).toHaveLength(4);
  });
});
