// util/enum.ts
export function getEnumKeyFromValue<T>(enumObject: T, value: number): keyof T | null {
    const key = Object.keys(enumObject).find(key => enumObject[key] === value);
    if(!key) return null;
    return key as keyof T;
}

export function getEnumValueFromKey<T>(enumObject: T, key: keyof T): T[keyof T] | null {
    if (!enumObject.hasOwnProperty(key)) {
        return null; 
    }
    return enumObject[key];
}