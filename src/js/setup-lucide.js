// Expone Lucide como window.lucide importando SOLO los iconos usados.
// Esto mantiene el bundle ligero en lugar de cargar los ~1500 iconos.
import { createIcons } from "lucide";
import {
  AlignLeft,
  Archive,
  ArrowRight,
  Bell,
  BellRing,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  Check,
  CheckCheck,
  CheckCircle2,
  Square,
  SquareCheckBig,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleDashed,
  CircleX,
  Clock,
  Cloud,
  Columns2,
  CornerDownRight,
  Download,
  Ellipsis,
  FilePlus,
  FileText,
  Flag,
  Flame,
  FolderInput,
  GripVertical,
  Inbox,
  Info,
  Keyboard,
  Languages,
  List,
  ListFilter,
  LogIn,
  LogOut,
  ListOrdered,
  ListPlus,
  ListTodo,
  Lock,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
  Plus,
  Repeat,
  Rows3,
  Rows4,
  Search,
  Settings,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  SunMoon,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  X,
  Zap,
} from "lucide";

const icons = {
  AlignLeft,
  Archive,
  ArrowRight,
  Bell,
  BellRing,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  Check,
  CheckCheck,
  CheckCircle2,
  Square,
  SquareCheckBig,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleDashed,
  CircleX,
  Clock,
  Cloud,
  Columns2,
  CornerDownRight,
  Download,
  Ellipsis,
  FilePlus,
  FileText,
  Flag,
  Flame,
  FolderInput,
  GripVertical,
  Inbox,
  Info,
  Keyboard,
  Languages,
  List,
  ListFilter,
  LogIn,
  LogOut,
  ListOrdered,
  ListPlus,
  ListTodo,
  Lock,
  Mail,
  MessageCircle,
  Moon,
  Palette,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PencilLine,
  Plus,
  Repeat,
  Rows3,
  Rows4,
  Search,
  Settings,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  SunMoon,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  UserRound,
  X,
  Zap,
};

/**
 * Convierte los `<i data-lucide>` pendientes en SVG.
 *
 * Lucide copia `data-lucide` al SVG que genera, así que sin más el propio
 * SVG vuelve a casar con el selector y CADA llamada reemplazaba de nuevo
 * TODOS los iconos del documento — 136 nodos sustituidos por cada acción,
 * porque render() llama a esto al final. Eso es lo que se veía como un
 * parpadeo de toda la interfaz al crear una subtarea o completar algo.
 *
 * Al terminar quitamos el atributo de los SVG ya convertidos: dejan de
 * casar, y las siguientes llamadas solo tocan lo que de verdad es nuevo.
 * Nada en la app consulta `data-lucide`, solo lo usa lucide para buscar.
 *
 * @param {{ root?: Element|Document, nodes?: Element[] }} [opts]
 */
function renderIcons(opts) {
  const o = opts || {};
  // `nodes` no existe en la API de lucide (es `root`), pero varias llamadas
  // del repo lo pasan; se traduce en vez de caer al documento entero.
  const roots =
    o.root ? [o.root] :
    Array.isArray(o.nodes) && o.nodes.length ? o.nodes :
    [document];

  for (const raw of roots) {
    if (!raw) continue;
    // Si nos pasan el propio <i>, hay que buscar desde su padre: lucide
    // solo mira descendientes de la raíz, nunca la raíz misma.
    const root =
      raw.nodeType === 1 && raw.hasAttribute && raw.hasAttribute("data-lucide")
        ? raw.parentNode || document
        : raw;
    if (!root || !root.querySelectorAll) continue;

    createIcons({ icons, ...o, root });
    root.querySelectorAll("svg.lucide[data-lucide]").forEach(function (svg) {
      svg.removeAttribute("data-lucide");
    });
  }
}

window.lucide = {
  /** Compatible con la API UMD: acepta opts.nodes, opts.attrs, etc. */
  createIcons: renderIcons,
};

// Renderiza los iconos data-lucide del HTML estático al cargar el módulo.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () {
    renderIcons();
  });
} else {
  renderIcons();
}
