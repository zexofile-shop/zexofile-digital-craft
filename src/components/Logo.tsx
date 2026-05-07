import logo from "@/assets/zexofile-logo.webp";

export function Logo({ size = 36, withText = false }: { size?: number; withText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logo}
        alt="Zexofile Shop logo"
        width={size}
        height={size}
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
      {withText && (
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-navy dark:text-foreground">
            Zexofile <span className="text-primary">Shop</span>
          </span>
          <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Digital Files, Delivered
          </span>
        </div>
      )}
    </div>
  );
}
