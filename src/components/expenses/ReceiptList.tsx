interface ReceiptListProps {
  receipts: string[];
}

export function ReceiptList({ receipts }: Readonly<ReceiptListProps>) {
  if (receipts.length === 0) {
    return <div>No receipts found</div>;
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => (
        <div
          key={receipt}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <span className="truncate">{receipt}</span>
        </div>
      ))}
    </div>
  );
}
