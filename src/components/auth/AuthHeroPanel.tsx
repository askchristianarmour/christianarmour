import { AuthLoadedImage } from './AuthLoadedImage'

export function AuthHeroPanel() {
  return (
    <div className="relative hidden min-h-[480px] flex-1 overflow-hidden bg-[#1c2b3a] lg:flex lg:min-h-0">
      <AuthLoadedImage
        src="/signin/backroundleft.svg"
        alt=""
        className="absolute inset-0"
        imgClassName="absolute inset-0 h-full w-full object-cover"
        spinnerSize="md"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="relative z-10 flex flex-col justify-end p-8 pb-12 xl:p-12">
        <h2 className="font-serif text-3xl font-bold leading-tight text-white xl:text-[2.5rem]">
          Equipping Believers.
          <br />
          Standing for Truth.
        </h2>
        <div className="mt-4 h-1 w-20 bg-amber-500" />
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
          Strength in faith. Armour for life. Truth that endures.
        </p>
      </div>
    </div>
  )
}
