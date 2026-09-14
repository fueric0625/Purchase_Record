export type PurchaseRecord = {
  id: string;
  title: string;
  author: string;
  purchaseDate: string;
  applicant: string;
  purchaser: string;
  quantity: number;
  cost: number;
  fundSource: string;
  destination: string;
  notes: string;
  photoName: string | null;
  invoiceName: string | null;
  purchaseDocName: string | null;
  extraDocName: string | null;
  extraDocOriginalName: string | null;
  createdAt: string;
  updatedAt: string;
  extraDocGenerated?: boolean;
};

export type RecordInput = {
  title: string;
  author: string;
  purchaseDate: string;
  applicant: string;
  purchaser: string;
  quantity: number;
  cost: number;
  fundSource: string;
  destination: string;
  notes: string;
};
