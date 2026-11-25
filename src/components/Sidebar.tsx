import {
  BookOpen,
  ClipboardList,
  Compass,
  Leaf,
  MessageCircle,
  MessageSquareHeart,
  Palette,
  Shield,
  Wind,
} from 'lucide-react';
import type { AppView } from '../shared/types';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenPrivacy: () => void;
  onOpenTheme: () => void;
  cu4Active: boolean;
  consultaCount: number;
  memoryEnabled: boolean;
}

const NAV_ITEMS: Array<{
  id: AppView;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { id: 'conversar', label: 'Conversar', icon: MessageCircle },
  { id: 'diario', label: 'Mi diario', icon: BookOpen },
  { id: 'calmarme', label: 'Calmarme', icon: Wind },
  { id: 'mensaje', label: 'Preparar mensaje', icon: MessageSquareHeart },
  { id: 'consulta', label: 'Notas para mi terapia', icon: ClipboardList },
  { id: 'apoyo', label: 'Red de apoyo y recursos', icon: Compass },
];

export function Sidebar({
  activeView,
  onSelectView,
  onOpenPrivacy,
  onOpenTheme,
  cu4Active,
  consultaCount,
  memoryEnabled,
}: SidebarProps) {
  return (
    <aside className="flex flex-col justify-between bg-ania-canvas border-r border-ania-border w-full lg:w-[248px] shrink-0 px-4 py-5 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-7">
          <div className="w-9 h-9 rounded-full bg-ania-accent-soft flex items-center justify-center text-ania-accent-text shrink-0">
            <Leaf className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight text-ania-heading">
            AnIA
          </span>
        </div>

        {/* Navigation */}
        <nav aria-label="Navegación principal" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = !cu4Active && activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-ania-accent-soft text-ania-accent-text'
                    : 'text-ania-ink-secondary hover:bg-ania-surface-hover hover:text-ania-ink'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-ania-accent-text' : 'text-ania-ink-subtle'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Control Card & Disclaimer */}
      <div className="mt-6 space-y-2.5">
        <button
          type="button"
          onClick={onOpenTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ania-ink-secondary hover:bg-ania-surface-hover transition-colors text-left"
        >
          <Palette className="w-4 h-4 text-ania-accent-text shrink-0" aria-hidden="true" />
          <span>Personalizar tema</span>
        </button>

        <button
          type="button"
          onClick={onOpenPrivacy}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ania-ink-secondary hover:bg-ania-surface-hover transition-colors text-left"
        >
          <Shield className="w-4 h-4 text-ania-accent-text shrink-0" aria-hidden="true" />
          <span>
            Privacidad y memoria · {memoryEnabled ? 'Activa' : 'Pausada'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSelectView('consulta')}
          className="w-full text-left bg-ania-surface border border-ania-border rounded-2xl p-3.5 hover:border-ania-accent-border transition-colors"
        >
          <p className="text-sm font-semibold text-ania-heading">
            Resumen para mi consulta
          </p>
          <p className="text-xs text-ania-ink-subtle mt-0.5 leading-snug">
            Solo se comparte si tú decides
            {consultaCount > 0 ? ` · ${consultaCount} puntos` : ''}
          </p>
        </button>

        <p className="text-[11px] leading-relaxed text-ania-ink-faint px-1">
          Este asistente acompaña y facilita, no sustituye al profesional ni toma decisiones por ti.
        </p>
      </div>
    </aside>
  );
}
