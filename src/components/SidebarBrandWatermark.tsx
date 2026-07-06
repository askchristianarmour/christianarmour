export function SidebarBrandWatermark() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -bottom-10 right-0 rotate-[-24deg] select-none text-right">
        <p className="font-serif text-[3.25rem] font-bold leading-[0.9] tracking-tight text-[#1c2b3a]/[0.045] sm:text-[4.25rem]">
          Christian
        </p>
        <p className="font-serif text-[3.25rem] font-bold leading-[0.9] tracking-tight text-[#1c2b3a]/[0.045] sm:text-[4.25rem]">
          Armour
        </p>
      </div>
    </div>
  )
}
