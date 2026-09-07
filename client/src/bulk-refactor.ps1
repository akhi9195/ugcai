# bulk-refactor.ps1
# Run from client/src/. Targets only files not yet touched
# (index.css, Buttons.tsx, Result.tsx, Navbar.tsx already done).

$changes = @(
    @{ File = "components/Hero.tsx"; Pairs = [ordered]@{
        "rounded-full bg-white/10 mb-6 justify-start" = "rounded-full bg-surface-hover mb-6 justify-start"
        "text-xs text-gray-200/90" = "text-xs text-muted"
        'className="text-gray-300 max-w-lg mb-8"' = 'className="text-muted max-w-lg mb-8"'
        "text-sm text-gray-200 bg-white/10 rounded" = "text-sm text-muted bg-surface-hover rounded"
        "hover:bg-white/3 transition-colors" = "hover:bg-surface transition-colors"
        "text-sky-500" = "text-accent-400"
        "text-xs text-gray-400" = "text-xs text-muted"
        "h-6 w-px bg-white/6" = "h-6 w-px bg-line"
        "text-cyan-500" = "text-accent-400"
        "border border-white/6 shadow-2xl bg-linear-to-b" = "border border-line shadow-2xl bg-linear-to-b"
        "bg-white/6 backdrop-blur-sm hover:bg-white/10 transition" = "bg-surface-hover backdrop-blur-sm hover:bg-line-strong transition"
        "w-14 h-10 rounded-lg overflow-hidden border border-white/6" = "w-14 h-10 rounded-lg overflow-hidden border border-line"
        "text-sm text-gray-400 ml-2 flex items-center gap-2" = "text-sm text-muted ml-2 flex items-center gap-2"
        "border-y border-white/6 bg-white/1 max-md:mt-10" = "border-y border-line bg-surface max-md:mt-10"
        "font-semibold text-gray-400 hover:text-gray-300 tracking-wide" = "font-semibold text-subtle hover:text-muted tracking-wide"
    }},
    @{ File = "components/Footer.tsx"; Pairs = [ordered]@{
        'className="bg-white/6 border-t border-white/6 pt-10 text-gray-300"' = 'className="bg-surface border-t border-line pt-10 text-muted"'
        "border-b border-white/10" = "border-b border-line"
        "text-base text-white md:mb-5" = "text-base text-foreground md:mb-5"
        'className="hover:text-white transition"' = 'className="hover:text-foreground transition"'
        "text-center text-sm text-gray-400" = "text-center text-sm text-muted"
    }},
    @{ File = "components/Features.tsx"; Pairs = [ordered]@{
        '"hover:border-white/15"' = '"hover:border-line-strong"'
        'className="rounded-2xl p-6 bg-white/3 border border-white/6"' = 'className="rounded-2xl p-6 bg-surface border border-line"'
        "text-gray-300 text-sm leading-relaxed" = "text-muted text-sm leading-relaxed"
    }},
    @{ File = "components/Faq.tsx"; Pairs = [ordered]@{
        'className="group bg-white/6 rounded-xl select-none"' = 'className="group bg-surface rounded-xl select-none"'
        "text-gray-300 group-open:rotate-180" = "text-muted group-open:rotate-180"
        "pt-0 text-sm text-gray-300 leading-relaxed" = "pt-0 text-sm text-muted leading-relaxed"
    }},
    @{ File = "components/CTA.tsx"; Pairs = [ordered]@{
        "text-slate-400 mb-10" = "text-muted mb-10"
    }},
    @{ File = "components/Title.tsx"; Pairs = [ordered]@{
        "text-2xl md:text-4xl text-white font-semibold" = "text-2xl md:text-4xl text-foreground font-semibold"
        "text-sm text-gray-400 my-3" = "text-sm text-muted my-3"
    }},
    @{ File = "components/UploadZone.tsx"; Pairs = [ordered]@{
        "border-white/10 hover:border-accent-500/30 hover:bg-white/5" = "border-line hover:border-accent-500/30 hover:bg-surface"
        'className="p-2 rounded-full bg-white/10 hover:bg-danger/20 text-white hover:text-danger transition-colors"' = 'className="p-2 rounded-full bg-surface-hover hover:bg-danger/20 text-foreground hover:text-danger transition-colors"'
        "p-3 rounded-lg border border-white/10" = "p-3 rounded-lg border border-line"
        "rounded-full bg-white/5 flex" = "rounded-full bg-surface flex"
        "text-gray-400 group-hover:text-accent-400" = "text-muted group-hover:text-accent-400"
        "text-sm text-gray-400 text-center" = "text-sm text-muted text-center"
    }},
    @{ File = "components/ProjectCard.tsx"; Pairs = [ordered]@{
        'className="relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition group"' = 'className="relative bg-surface border border-line rounded-xl overflow-hidden hover:border-line-strong transition group"'
        "w-40 bg-black/50" = "w-40 bg-popover"
        "backdrop-blur text-white border border-gray-500/50" = "backdrop-blur text-foreground border border-line-strong"
        "hover:bg-black/10 cursor-pointer" = "hover:bg-popover-hover cursor-pointer"
        "px-2 py-1 bg-white/5 rounded-full" = "px-2 py-1 bg-surface rounded-full"
        "text-sm text-gray-300 bg-white/3 p-2" = "text-sm text-muted bg-surface p-2"
        "text-xs text-gray-400 mb-1" = "text-xs text-muted mb-1"
        'className="text-sm text-gray-400">' = 'className="text-sm text-muted">'
        "text-xs text-gray-500 mt-1" = "text-xs text-subtle mt-1"
        'text-sm text-gray-300">{gen.userPrompt}' = 'text-sm text-muted">{gen.userPrompt}'
    }},
    @{ File = "pages/Generator.tsx"; Pairs = [ordered]@{
        "min-h-screen text-white p-6 md:p-12 mt-28" = "min-h-screen text-foreground p-6 md:p-12 mt-28"
        'className="mb-4 text-gray-300"' = 'className="mb-4 text-muted"'
        "bg-white/3 rounded-lg border-2 p-4 text-sm border-accent-200/10 focus:border-accent-500/50" = "bg-surface rounded-lg border-2 p-4 text-sm border-accent-200/10 focus:border-accent-500/50"
        "p-2.5 size-13 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer" = "p-2.5 size-13 bg-surface-hover rounded transition-all ring-2 ring-transparent cursor-pointer"
        "ring-accent-500/50 bg-white/10" = "ring-accent-500/50 bg-line-strong"
    }},
    @{ File = "pages/Plans.tsx"; Pairs = [ordered]@{
        "text-center text-gray-400 mx-w-md" = "text-center text-muted mx-w-md"
    }},
    @{ File = "pages/MyGenerations.tsx"; Pairs = [ordered]@{
        "min-h-screen text-white p-6 md:p-12 my-28" = "min-h-screen text-foreground p-6 md:p-12 my-28"
        'className="text-gray-400">' = 'className="text-muted">'
        "py-20 bg-white/5 rounded-xl border border-white/10" = "py-20 bg-surface rounded-xl border border-line"
        'className="text-gray-400 mb-6"' = 'className="text-muted mb-6"'
    }},
    @{ File = "pages/Community.tsx"; Pairs = [ordered]@{
        "min-h-screen text-white p-6 md:p-12 my-28" = "min-h-screen text-foreground p-6 md:p-12 my-28"
        'className="text-gray-400">' = 'className="text-muted">'
    }},
    @{ File = "components/Pricing.tsx"; Pairs = [ordered]@{
        "py-20 bg-white/3 border-t border-white/6" = "py-20 bg-surface border-t border-line"
        'colorPrimary: "#3949AB",' = 'colorPrimary: "var(--color-accent-400)",'
        'pricingTableCardBody: "bg-white/6",' = 'pricingTableCardBody: "bg-surface",'
        'pricingTableCardHeader: "bg-white/10",' = 'pricingTableCardHeader: "bg-surface-hover",'
        'switchThumb: "bg-white",' = 'switchThumb: "bg-foreground",'
    }}
)

foreach ($item in $changes) {
    $path = $item.File
    if (-not (Test-Path $path)) {
        Write-Warning "Not found, skipped: $path"
        continue
    }

    $content = Get-Content -Path $path -Raw
    $original = $content
    $matchCount = 0

    foreach ($old in $item.Pairs.Keys) {
        if ($content.Contains($old)) { $matchCount++ }
        $content = $content.Replace($old, $item.Pairs[$old])
    }

    if ($content -ne $original) {
        Set-Content -Path $path -Value $content -NoNewline
        Write-Host "Updated ($matchCount/$($item.Pairs.Count) patterns matched): $path"
    } else {
        Write-Warning "NO patterns matched (check file wasn't already edited or has drifted formatting): $path"
    }
}

Write-Host "`nDone. Run 'git diff' now and review every file before committing."