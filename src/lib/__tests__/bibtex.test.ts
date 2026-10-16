import { describe, it, expect } from 'vitest';
import { parseBibTeX } from '../bibtex';

describe('parseBibTeX', () => {
  it('parses a simple inproceedings entry', () => {
    const bib = `@inproceedings{doe2024test,
  title={A Test Paper},
  author={Doe, John and Smith, Jane},
  booktitle={Conference on Testing},
  year={2024},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs).toHaveLength(1);
    expect(pubs[0].title).toBe('A Test Paper');
    expect(pubs[0].authors).toEqual(['John Doe', 'Jane Smith']);
    expect(pubs[0].year).toBe(2024);
    expect(pubs[0].venueType).toBe('conference');
  });

  it('handles nested braces in title', () => {
    const bib = `@article{doe2024nested,
  title={A Paper about {BERT} and {GPT-4}},
  author={Doe, John},
  journal={Nature},
  year={2024},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs).toHaveLength(1);
    expect(pubs[0].title).toBe('A Paper about BERT and GPT-4');
  });

  it('handles multiple entries', () => {
    const bib = `@inproceedings{a2024first,
  title={First Paper},
  author={Author, A},
  booktitle={Conf A},
  year={2024},
}

@article{b2023second,
  title={Second Paper},
  author={Author, B},
  journal={Journal B},
  year={2023},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs).toHaveLength(2);
    expect(pubs[0].year).toBe(2024); // sorted by year desc
    expect(pubs[1].year).toBe(2023);
  });

  it('skips comment entries', () => {
    const bib = `@comment{key, this is a comment}

@inproceedings{real2024paper,
  title={Real Paper},
  author={Real, Author},
  booktitle={Real Conf},
  year={2024},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs).toHaveLength(1);
  });

  it('handles selected field', () => {
    const bib = `@inproceedings{sel2024paper,
  title={Selected Paper},
  author={Author, Test},
  booktitle={Conf},
  year={2024},
  selected={true},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs[0].selected).toBe(true);
  });

  it('cleans TeX accents', () => {
    const bib = `@article{accent2024paper,
  title={Caf\\'{e} and na\\"ive},
  author={M\\"{u}ller, Hans},
  journal={Journal},
  year={2024},
}`;
    const pubs = parseBibTeX(bib);
    expect(pubs[0].title).toBe('Cafe and naive');
  });

  it('detects venue types correctly', () => {
    const workshop = `@inproceedings{w2024,
  title={Workshop Paper},
  author={A, B},
  booktitle={NeurIPS Workshop on Fun},
  year={2024},
}`;
    const preprint = `@misc{p2024,
  title={Preprint Paper},
  author={A, B},
  journal={arXiv preprint},
  year={2024},
}`;
    expect(parseBibTeX(workshop)[0].venueType).toBe('workshop');
    expect(parseBibTeX(preprint)[0].venueType).toBe('preprint');
  });
});
