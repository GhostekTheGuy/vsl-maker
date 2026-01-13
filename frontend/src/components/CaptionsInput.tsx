import { useState } from 'react';
import { Textarea } from './ui/Textarea';

interface CaptionsInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const EXAMPLE_CAPTIONS = [
  'Czy wiesz, ze medytacja przez 10 minut dziennie moze zmienic twoje zycie?',
  '5 nawykow ludzi sukcesu, ktore mozesz zaczac juz dzis',
  'Jak zarabiam 10000 zl miesiecznie pracujac tylko 4 godziny dziennie',
];

export function CaptionsInput({ value, onChange, error }: CaptionsInputProps) {
  const [showExamples, setShowExamples] = useState(false);

  const minLength = 50;
  const charCount = value.length;
  const isValid = charCount >= minLength;

  return (
    <div className="space-y-2">
      <Textarea
        id="captions"
        label="Tekst/Captions"
        placeholder="Wpisz tekst, ktory ma byc przeksztalcony w scenariusz rolki..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        error={error}
      />

      <div className="flex justify-between items-center text-sm">
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          {showExamples ? 'Ukryj przyklady' : 'Pokaz przyklady'}
        </button>
        <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
          {charCount} / {minLength} znakow (min.)
        </span>
      </div>

      {showExamples && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="text-sm font-medium text-gray-700">Przyklady:</p>
          {EXAMPLE_CAPTIONS.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(example)}
              className="block w-full text-left p-2 text-sm text-gray-600 hover:bg-white rounded transition-colors"
            >
              "{example}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
