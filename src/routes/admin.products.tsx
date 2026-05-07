import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Image as ImageIcon, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useServerFn } from "@tanstack/react-start";
import { uploadImage } from "@/server-fns/uploads.functions";
import { adminDeleteProduct, adminListProducts, adminSaveProduct } from "@/server-fns/admin.functions";
import { withAuthHeaders } from "@/lib/server-fn-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  component: ProductsAdmin,
});

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function ProductsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const listProducts = useServerFn(adminListProducts);
  const removeProduct = useServerFn(adminDeleteProduct);
  const refresh = () => withAuthHeaders(undefined as never).then((opts) => listProducts(opts)).then((res) => setItems(res?.items ?? []));
  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">Manage Apps</h1>
          <p className="text-sm text-muted-foreground">ZexoFile products stay on the same backend logic, only the admin workflow is cleaner.</p>
        </div>
        <ProductDialog onSaved={refresh} trigger={<Button><Plus className="h-4 w-4 mr-1" />New product</Button>} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card shadow-card">
            <div className="aspect-video bg-muted relative">
              {p.banner_image ? <img src={p.banner_image} className="w-full h-full object-cover" alt={p.name} /> : <div className="flex h-full items-center justify-center text-muted-foreground"><ImageIcon /></div>}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.category || "Uncategorized"} · ₹{p.regular_price}</div>
                </div>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {p.is_active ? "Live" : "Draft"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <ProductDialog product={p} onSaved={refresh} trigger={<Button variant="outline" size="sm"><Edit3 className="h-3.5 w-3.5 mr-1" />Edit</Button>} />
                <Button variant="ghost" size="sm" className="text-destructive" onClick={async () => {
                  if (confirm("Delete this product?")) {
                    await removeProduct(await withAuthHeaders({ id: p.id }));
                    toast.success("Deleted"); refresh();
                  }
                }}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
              </div>
            </div>
          </div>
        ))}
        {!items.length && <div className="col-span-full rounded-2xl border border-dashed bg-card/60 p-10 text-center text-muted-foreground"><Package2 className="mx-auto mb-3 h-8 w-8" />No products yet.</div>}
      </div>
    </div>
  );
}

function ProductDialog({ product, trigger, onSaved }: { product?: any; trigger: React.ReactNode; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const upload = useServerFn(uploadImage);
  const saveProduct = useServerFn(adminSaveProduct);
  const [f, setF] = useState<any>(product ?? {
    name: "", slug: "", category: "", short_description: "", full_description: "",
    regular_price: 0, discount_price: null, source_code_price: null, customization_price: null,
    banner_image: "", youtube_url: "", tags: [], gallery_images: [],
    is_active: true, is_featured: false, is_best_selling: false,
    instant_delivery_enabled: true, instant_delivery_url: "",
    customizable_enabled: false, dual_button_mode: false,
    primary_button_label: "Buy Source Code", secondary_button_label: "Get Customized",
  });

  useEffect(() => { if (open && product) setF(product); }, [open, product]);

  const setK = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  const handleFile = async (file: File, key: "banner_image" | "gallery") => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await upload(await withAuthHeaders({ imageBase64: String(reader.result), filename: file.name }));
        if (key === "banner_image") setK("banner_image", res.url);
        else setK("gallery_images", [...(f.gallery_images ?? []), res.url]);
        toast.success("Uploaded");
      } catch (e: any) { toast.error(e.message); }
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const payload = { ...f, id: product?.id, slug: f.slug || slugify(f.name), regular_price: Number(f.regular_price) || 0 };
    delete payload.created_at; delete payload.updated_at;
    await saveProduct(await withAuthHeaders(payload));
    toast.success("Saved"); setOpen(false); onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Edit" : "New"} product</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={f.name} onChange={(e) => setK("name", e.target.value)} /></div>
            <div><Label>Slug</Label><Input value={f.slug} onChange={(e) => setK("slug", e.target.value)} placeholder="auto" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label><Input value={f.category ?? ""} onChange={(e) => setK("category", e.target.value)} /></div>
            <div><Label>Tags (comma)</Label><Input value={(f.tags ?? []).join(",")} onChange={(e) => setK("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></div>
          </div>
          <div><Label>Short description</Label><Input value={f.short_description ?? ""} onChange={(e) => setK("short_description", e.target.value)} /></div>
          <div><Label>Full description</Label><Textarea rows={4} value={f.full_description ?? ""} onChange={(e) => setK("full_description", e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Regular ₹</Label><Input type="number" value={f.regular_price ?? 0} onChange={(e) => setK("regular_price", Number(e.target.value))} /></div>
            <div><Label>Discount ₹</Label><Input type="number" value={f.discount_price ?? ""} onChange={(e) => setK("discount_price", e.target.value === "" ? null : Number(e.target.value))} /></div>
            <div><Label>Customization ₹</Label><Input type="number" value={f.customization_price ?? ""} onChange={(e) => setK("customization_price", e.target.value === "" ? null : Number(e.target.value))} /></div>
          </div>
          <div>
            <Label>Banner image</Label>
            <div className="flex gap-2 items-center mt-1">
              {f.banner_image && <img src={f.banner_image} className="h-16 w-24 rounded object-cover ring-1 ring-border" />}
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "banner_image")} />
            </div>
          </div>
          <div>
            <Label>Gallery</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {(f.gallery_images ?? []).map((u: string, i: number) => (
                <div key={i} className="relative">
                  <img src={u} className="h-14 w-14 rounded object-cover ring-1 ring-border" />
                  <button onClick={() => setK("gallery_images", f.gallery_images.filter((_: any, j: number) => j !== i))} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-4 w-4 text-[10px]">×</button>
                </div>
              ))}
              <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "gallery")} className="w-auto" />
            </div>
          </div>
          <div><Label>YouTube URL</Label><Input value={f.youtube_url ?? ""} onChange={(e) => setK("youtube_url", e.target.value)} /></div>
          <div><Label>Instant delivery URL (Mega/Drive)</Label><Input value={f.instant_delivery_url ?? ""} onChange={(e) => setK("instant_delivery_url", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["is_active","Active"],["is_featured","Featured"],["is_best_selling","Best selling"],
              ["instant_delivery_enabled","Instant delivery"],["customizable_enabled","Customizable"],["dual_button_mode","Dual buttons"],
            ].map(([k,l]) => (
              <label key={k} className="flex items-center justify-between rounded-lg p-2 ring-1 ring-border">
                <span className="text-sm">{l}</span><Switch checked={!!f[k]} onCheckedChange={(v) => setK(k, v)} />
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save}>Save product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
