import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/wallet")({ component: WalletAdmin });

function WalletAdmin() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Wallet Tools</h1>
      <p className="text-sm text-muted-foreground">
        Adjust user balances from the <Link to="/admin/users" className="text-primary underline">Users</Link> page (Wallet button on each row).
      </p>
    </div>
  );
}
