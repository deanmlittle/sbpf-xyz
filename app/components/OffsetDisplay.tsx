import { Offset, OffsetDisplayProps } from "../types";

const OffsetDisplay = ({ accounts, language }: OffsetDisplayProps) => {
  const calculateOffsets = () => {
    let currentOffset = 0x0008;
    const offsets: Offset[] = [];
    const padding = 10240;

    const addOffset = (
      accountName: string,
      fieldName: string,
      size?: number
    ) => {
      offsets.push({
        name: `${accountName}_${fieldName}`,
        offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
      });
      currentOffset += size || 0;
    };

    const align = () => {
      if (currentOffset % 8 !== 0) {
        const alignmentPadding = 8 - (currentOffset % 8);
        currentOffset += alignmentPadding;
      }
    };

    offsets.push({
      name: "NUM_ACCOUNTS",
      offset: "0x0000",
    });

    accounts.forEach((account) => {
      const name = account.name.toUpperCase();
      addOffset(name, "HEADER", 8);
      addOffset(name, "KEY", 32);
      addOffset(name, "OWNER", 32);
      addOffset(name, "LAMPORTS", 8);
      addOffset(name, "DATA_LEN", 8);
      // addOffset(name, 'EXTRA', 8);
      addOffset(name, "DATA", account.dataLength);
      currentOffset += padding;
      currentOffset += 8; // Rent exemption
      align();
    });

    // align();

    offsets.push({
      name: "INSTRUCTION_DATA_LEN",
      offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
    });
    currentOffset += 8;

    offsets.push({
      name: "INSTRUCTION_DATA",
      offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
    });

    offsets.push({
      name: "PROGRAM_ID",
      offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
    });

    return offsets;
  };

  const formatOffset = (name: string, offset: string) => {
    switch (language) {
      case "Rust":
        return (
          <div className="leading-loose">
            <span className="text-purple-400">const</span>
            <span className="text-gray-300"> {name}:</span>
            <span className="text-purple-400"> usize</span>
            <span className="text-gray-300"> = </span>
            <span className="text-amber-300">{offset}</span>
            <span className="text-gray-300">;</span>
          </div>
        );
      case "C":
        return (
          <div className="leading-loose">
            <span className="text-purple-400">#define</span>
            <span className="text-gray-300"> {name}</span>
            <span className="text-amber-300"> {offset}</span>
          </div>
        );
      case "ASM":
        return (
          <div className="leading-loose">
            <span className="text-purple-400">.equ</span>
            <span className="text-gray-300"> {name}, </span>
            <span className="text-amber-300">{offset}</span>
          </div>
        );
    }
  };

  const offsets = calculateOffsets();

  return (
    <div className="bg-gray-700 rounded-b-lg p-4 font-mono text-sm border-t-0 border-x-4 border-b-4 border-black">
      {offsets.map((offset, idx) => (
        <div key={idx}>{formatOffset(offset.name, offset.offset)}</div>
      ))}
    </div>
  );
};

export default OffsetDisplay;
