import { Document, Packer, Paragraph, TextRun } from "docx";
import type { PurchaseRecord } from "./types";

function dateText(value: string): string {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month) return value;
  return day ? `${year}年${Number(month)}月${Number(day)}日` : `${year}年${Number(month)}月`;
}

function costText(value: number): string {
  if (!Number.isFinite(value) || value === 0) return "";
  return `${value}元`;
}

function run(text: string) {
  return new TextRun({
    text,
    font: {
      ascii: "Times New Roman",
      eastAsia: "宋体",
      hAnsi: "Times New Roman",
    },
    size: 24,
  });
}

function line(text: string, indent = false) {
  return new Paragraph({
    indent: indent ? { firstLine: 420 } : undefined,
    spacing: { line: 360 },
    children: [run(text)],
  });
}

export async function buildPurchaseDocx(record: PurchaseRecord): Promise<Buffer> {
  const quantity = record.quantity ? `${record.quantity}本` : "";
  const destinationLines = record.destination
    ? record.destination.split(/\r?\n/)
    : [""];

  const children = [
    line(`书名：${record.title}`),
    line(`作者：${record.author}`),
    line(`时间：${dateText(record.purchaseDate)}`),
    line(`购买申请：${record.applicant}`),
    line(`采购人员：${record.purchaser}`),
    line(`购买数量：${quantity}`),
    line(`费用：${costText(record.cost)}`),
    line(`报销经费：${record.fundSource}`),
    line(`图书去向：${destinationLines[0] ?? ""}`),
    ...destinationLines.slice(1).map((item) => line(item, true)),
    line(`备注：${record.notes}`),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1440,
              right: 1800,
              bottom: 1440,
              left: 1800,
            },
          },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
