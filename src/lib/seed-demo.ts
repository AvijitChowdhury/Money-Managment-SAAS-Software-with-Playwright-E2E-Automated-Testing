import { supabase } from "@/integrations/supabase/client";

// Seeds demo data for the currently signed-in user if their transactions table is empty.
export async function seedDemoDataIfEmpty(userId: string) {
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count ?? 0) > 0) return;

  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .insert([
      { user_id: userId, name: "VISA", type: "card", masked_number: "**** 4511", balance: 5500, currency: "USD" },
      { user_id: userId, name: "Mastercard", type: "card", masked_number: "**** 4616", balance: 7500, currency: "USD" },
      { user_id: userId, name: "Payoneer", type: "wallet", masked_number: "****86@email.com", balance: 7700, currency: "USD" },
    ])
    .select();
  if (accErr) console.error("[seed] accounts:", accErr);

  const acctId = (i: number) => accounts?.[i]?.id ?? null;

  const cats = ["Food & Groceries", "Cafe & Restaurants", "Entertainment", "Investments", "Health & Beauty", "Travelling", "Shopping", "Salary", "Subscription"];
  await supabase.from("categories").insert(
    cats.map((name) => ({ user_id: userId, name, kind: ["Salary"].includes(name) ? "income" : "expense" })),
  );

  const now = new Date();
  const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), d).toISOString();

  await supabase.from("transactions").insert([
    { user_id: userId, account_id: acctId(0), amount: 50, kind: "expense", payment_name: "Miro", method: "VISA * 4511", status: "successful", occurred_at: day(2) },
    { user_id: userId, account_id: acctId(1), amount: 150, kind: "expense", payment_name: "Nike", method: "Mastercard * 4616", status: "successful", occurred_at: day(4) },
    { user_id: userId, account_id: acctId(1), amount: 190, kind: "expense", payment_name: "Chipotle", method: "Mastercard * 4616", status: "successful", occurred_at: day(5) },
    { user_id: userId, account_id: acctId(2), amount: 500, kind: "income", payment_name: "Freelance project", method: "Payoneer", status: "successful", occurred_at: day(6) },
    { user_id: userId, account_id: acctId(0), amount: 430, kind: "income", payment_name: "Transfer from JazzCash", method: "VISA * 4511", status: "successful", occurred_at: day(8) },
    { user_id: userId, account_id: acctId(1), amount: 300, kind: "expense", payment_name: "Domino's Pizza", method: "VISA * 4511", status: "successful", occurred_at: day(10) },
    { user_id: userId, account_id: acctId(2), amount: 230, kind: "income", payment_name: "Airbnb payout", method: "Mastercard * 4616", status: "successful", occurred_at: day(12) },
    { user_id: userId, account_id: acctId(0), amount: 75, kind: "income", payment_name: "PeoplePerHour", method: "Payoneer", status: "successful", occurred_at: day(14) },
    { user_id: userId, account_id: acctId(1), amount: 160, kind: "expense", payment_name: "Nike", method: "VISA * 4511", status: "successful", occurred_at: day(16) },
    { user_id: userId, account_id: acctId(2), amount: 1000, kind: "income", payment_name: "LinkedIn contract", method: "Mastercard * 4616", status: "successful", occurred_at: day(18) },
  ]);

  await supabase.from("goals").insert([
    { user_id: userId, name: "MacBook Pro", target_amount: 1800, saved_amount: 702 },
    { user_id: userId, name: "International Vacation", target_amount: 4600, saved_amount: 2070 },
    { user_id: userId, name: "New House", target_amount: 550000, saved_amount: 44000 },
  ]);

  await supabase.from("budgets").insert([
    { user_id: userId, category_name: "Food & Groceries", amount: 800 },
    { user_id: userId, category_name: "Cafe & Restaurants", amount: 400 },
    { user_id: userId, category_name: "Entertainment", amount: 300 },
    { user_id: userId, category_name: "Shopping", amount: 600 },
    { user_id: userId, category_name: "Travelling", amount: 1200 },
    { user_id: userId, category_name: "Health & Beauty", amount: 250 },
  ]);
}
