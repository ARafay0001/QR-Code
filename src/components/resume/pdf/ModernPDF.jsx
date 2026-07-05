import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111827",
    lineHeight: 1.5,
  },

  header: {
    marginBottom: 20,
  },

  name: {
    fontSize: 28,
    fontWeight: "bold",
  },

  title: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },

  contact: {
    marginTop: 12,
  },

  section: {
    marginTop: 20,
  },

  heading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    borderBottom: "1 solid #d1d5db",
    paddingBottom: 4,
  },

  item: {
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  subtitle: {
    fontWeight: "bold",
    fontSize: 12,
  },

  muted: {
    color: "#6b7280",
    fontSize: 10,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  tag: {
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 10,
  },
});

export default function ModernPDF({ data }) {
  const personal = data.personal || {};

  return (
    <Document>

      <Page size="A4" style={styles.page}>

        <View style={styles.header}>

          <Text style={styles.name}>
            {personal.firstName} {personal.lastName}
          </Text>

          <Text style={styles.title}>
            {personal.jobTitle}
          </Text>

          <View style={styles.contact}>

            {personal.email && (
              <Text>{personal.email}</Text>
            )}

            {personal.phone && (
              <Text>{personal.phone}</Text>
            )}

            {personal.location && (
              <Text>{personal.location}</Text>
            )}

            {personal.website && (
              <Link src={personal.website}>
                {personal.website}
              </Link>
            )}

          </View>

        </View>

        {data.summary && (
          <View style={styles.section}>

            <Text style={styles.heading}>
              Professional Summary
            </Text>

            <Text>
              {data.summary}
            </Text>

          </View>
        )}

      </Page>

    </Document>
  );
}