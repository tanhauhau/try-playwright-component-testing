import React, { useState } from 'react';

export default function Counter({ id = 'test' }: { id?: string }) {
  const [count, setCount] = useState(0);

  return (
    <button data-testid={id} onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
