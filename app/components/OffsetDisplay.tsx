import { Offset, OffsetDisplayProps, INSTRUCTION_DATA_TYPES, SPL_MINT_FIELDS, SPL_TOKEN_FIELDS, TOKEN2022_MINT_FIELDS, SYSVAR_CLOCK_FIELDS, SYSVAR_RENT_FIELDS } from "../types";

const OffsetDisplay = ({ accounts, instructionData, language }: OffsetDisplayProps) => {
  const calculateOffsets = () => {
    let currentOffset = 0x0008;
    const offsets: Offset[] = [];
    const padding = 10240;

    const addOffset = (
      accountName: string,
      fieldName: string,
      size?: number,
      comment?: string
    ) => {
      offsets.push({
        name: `${accountName}_${fieldName}`,
        offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
        comment,
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
      
      // Add DATA offset
      const dataStartOffset = currentOffset;
      
      // Only show DATA offset for certain account types
      const shouldShowDataOffset = !(
        account.type === "SPL Mint" || 
        account.type === "SPL Token" || 
        account.type === "Sysvar Clock" ||
        account.type === "Sysvar Rent" ||
        (account.type === "TypedAccount" && account.customFields && account.customFields.length > 0)
      );
      
      if (shouldShowDataOffset) {
        addOffset(name, "DATA", 0); // Just mark the start of data
      }
      
      // Add individual field offsets for mint accounts
      if (account.type === "SPL Mint") {
        SPL_MINT_FIELDS.forEach((field) => {
          const fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + field.offset).toString(16).padStart(4, "0"),
            comment: `${field.type} (${fieldSize} bytes)`,
          });
        });
        currentOffset += account.dataLength;
      } else if (account.type === "SPL Token") {
        SPL_TOKEN_FIELDS.forEach((field) => {
          const fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + field.offset).toString(16).padStart(4, "0"),
            comment: `${field.type} (${fieldSize} bytes)`,
          });
        });
        currentOffset += account.dataLength;
      } else if (account.type === "Sysvar Clock") {
        SYSVAR_CLOCK_FIELDS.forEach((field) => {
          const fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + field.offset).toString(16).padStart(4, "0"),
            comment: `${field.type} (${fieldSize} bytes)`,
          });
        });
        currentOffset += account.dataLength;
      } else if (account.type === "Sysvar Rent") {
        SYSVAR_RENT_FIELDS.forEach((field) => {
          const fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + field.offset).toString(16).padStart(4, "0"),
            comment: `${field.type} (${fieldSize} bytes)`,
          });
        });
        currentOffset += account.dataLength;
      } else if (account.type === "Token2022 Mint") {
        TOKEN2022_MINT_FIELDS.forEach((field) => {
          const fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + field.offset).toString(16).padStart(4, "0"),
            comment: `${field.type} (${fieldSize} bytes)`,
          });
        });
        currentOffset += account.dataLength;
      } else if (account.type === "TypedAccount" && account.customFields) {
        // Add individual field offsets for TypedAccount custom fields
        let fieldOffset = 0;
        account.customFields.forEach((field) => {
          let fieldSize = INSTRUCTION_DATA_TYPES[field.type];
          if (field.type === "[u8;N]") {
            fieldSize = field.size || 1;
          }
          
          offsets.push({
            name: `${name}_${field.name.toUpperCase()}`,
            offset: "0x" + (dataStartOffset + fieldOffset).toString(16).padStart(4, "0"),
            comment: `${field.type}${field.type === "[u8;N]" ? `[${field.size}]` : ""} (${fieldSize} bytes)`,
          });
          fieldOffset += fieldSize;
        });
        currentOffset += account.dataLength;
      } else {
        currentOffset += account.dataLength;
      }
      
      currentOffset += padding;
      currentOffset += 8; // Rent exemption
      align();
    });

    offsets.push({
      name: "INSTRUCTION_DATA_LEN",
      offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
    });
    currentOffset += 8;

    const instructionDataStart = currentOffset;
    offsets.push({
      name: "INSTRUCTION_DATA",
      offset: "0x" + instructionDataStart.toString(16).padStart(4, "0"),
    });

    // Add instruction data fields
    instructionData.forEach((field) => {
      let fieldSize = INSTRUCTION_DATA_TYPES[field.type];
      if (field.type === "[u8;N]") {
        fieldSize = field.size || 1;
      }
      
      offsets.push({
        name: `INSTRUCTION_${field.name.toUpperCase()}`,
        offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
        comment: `${field.type}${field.type === "[u8;N]" ? `[${field.size}]` : ""} (${fieldSize} bytes)`,
      });
      currentOffset += fieldSize;
    });

    offsets.push({
      name: "PROGRAM_ID",
      offset: "0x" + currentOffset.toString(16).padStart(4, "0"),
    });

    return offsets;
  };

  const formatOffset = (name: string, offset: string, comment?: string) => {
    const commentText = comment ? ` // ${comment}` : "";
    
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
            <span className="text-green-400">{commentText}</span>
          </div>
        );
      case "C":
        return (
          <div className="leading-loose">
            <span className="text-purple-400">#define</span>
            <span className="text-gray-300"> {name}</span>
            <span className="text-amber-300"> {offset}</span>
            <span className="text-green-400">{commentText}</span>
          </div>
        );
      case "ASM":
        return (
          <div className="leading-loose">
            <span className="text-purple-400">.equ</span>
            <span className="text-gray-300"> {name}, </span>
            <span className="text-amber-300">{offset}</span>
            <span className="text-green-400">{commentText}</span>
          </div>
        );
    }
  };

  const offsets = calculateOffsets();

  return (
    <div className="bg-gray-700 rounded-b-lg p-4 font-mono text-sm border-t-0 border-x-4 border-b-4 border-black">
      {offsets.map((offset, idx) => (
        <div key={idx}>{formatOffset(offset.name, offset.offset, offset.comment)}</div>
      ))}
    </div>
  );
};

export default OffsetDisplay;
