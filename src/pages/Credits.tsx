import { ReactNode, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Columns, SiteBox, SiteLayout, site } from '../site/Site';

const PUBLIC = process.env.PUBLIC_URL ?? '';
const COLORS = [site.blue, site.green, site.orange, site.navy, site.red];

interface Section {
    title: string;
    lines: string[];
}

/** Splits the sprite credits (Markdown) into one section per "## " heading. */
const parse = (markdown: string): Section[] => {
    const sections: Section[] = [];
    for (const raw of markdown.split('\n')) {
        const line = raw.trim();
        if (line.startsWith('## ')) sections.push({ title: line.slice(3), lines: [] });
        else if (line && !line.startsWith('# ') && sections.length) sections[sections.length - 1].lines.push(line);
    }
    return sections;
};

/** Turns [text](url) and bare links into anchors. */
const linkify = (text: string): ReactNode[] =>
    text.split(/(\[[^\]]+\]\([^)]+\)|https?:\/\/\S+)/g).map((part, i) => {
        const md = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        const href = md ? md[2] : /^https?:\/\//.test(part) ? part : null;
        if (!href) return part;
        return <a key={i} href={href} target="_blank" rel="noreferrer" style={{ color: site.blue, wordBreak: 'break-all' }}>{md ? md[1] : part}</a>;
    });

const Lines = ({ lines }: { lines: string[] }) => {
    const items = lines.filter((l) => l.startsWith('- '));
    const text = lines.filter((l) => !l.startsWith('- '));
    return (
        <>
            {text.map((l, i) => <Box key={i} sx={{ mb: 0.75 }}>{linkify(l)}</Box>)}
            {items.length > 0 && (
                <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                    {items.map((l, i) => <li key={i}>{linkify(l.slice(2))}</li>)}
                </Box>
            )}
        </>
    );
};

/** Who made the art: the avatar sprites (LPC) and the furniture (Kenney and KayKit). */
export const Credits = () => {
    const [sections, setSections] = useState<Section[]>([]);
    useEffect(() => {
        fetch(`${PUBLIC}/avatar/lpc/CREDITS.md`).then((r) => r.text()).then((md) => setSections(parse(md))).catch(() => undefined);
    }, []);

    return (
        <SiteLayout>
            <Columns
                leftWidth={340}
                left={(
                    <>
                        <SiteBox title="Thank you, artists!">
                            EduVerse is built with free art made by generous artists. Every avatar and piece of furniture you
                            see comes from the packs on this page.
                        </SiteBox>
                        <SiteBox title="Furniture" color={site.green}>
                            <Box sx={{ mb: 1 }}>
                                Furniture is rendered from free 3D models, released under{' '}
                                <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer" style={{ color: site.blue }}>CC0</a>:
                            </Box>
                            <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
                                <li><a href="https://kenney.nl/assets/furniture-kit" target="_blank" rel="noreferrer" style={{ color: site.blue }}>Furniture Kit</a> by Kenney</li>
                                <li><a href="https://kaylousberg.itch.io/furniture-bits" target="_blank" rel="noreferrer" style={{ color: site.blue }}>Furniture Bits</a> by Kay Lousberg (KayKit)</li>
                                <li><a href="https://kaylousberg.itch.io/restaurant-bits" target="_blank" rel="noreferrer" style={{ color: site.blue }}>Restaurant Bits</a> by Kay Lousberg (KayKit)</li>
                            </Box>
                        </SiteBox>
                        <SiteBox title="Avatars" color={site.orange}>
                            Avatar sprites come from the{' '}
                            <a href="https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator" target="_blank" rel="noreferrer" style={{ color: site.blue }}>Liberated Pixel Cup</a>{' '}
                            (CC-BY-SA 3.0 / GPL 3.0 / OGA-BY 3.0). The artists of each part are listed on the right.
                        </SiteBox>
                    </>
                )}
                right={(
                    <>
                        {sections.map((section, i) => (
                            <SiteBox key={section.title} title={section.title} color={COLORS[i % COLORS.length]}>
                                <Box sx={{ fontSize: 12.5 }}><Lines lines={section.lines} /></Box>
                            </SiteBox>
                        ))}
                    </>
                )}
            />
        </SiteLayout>
    );
};
